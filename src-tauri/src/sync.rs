//! Lock-taking that survives a poisoned mutex, so a loop `logging::supervise` restarts does not die on its first lock.

use std::sync::{Mutex, MutexGuard, RwLock, RwLockReadGuard, RwLockWriteGuard};

pub trait LockExt<T> {
    /// The guard, poisoned or not.
    fn guard(&self) -> MutexGuard<'_, T>;
}

impl<T> LockExt<T> for Mutex<T> {
    fn guard(&self) -> MutexGuard<'_, T> {
        self.lock().unwrap_or_else(|e| e.into_inner())
    }
}

pub trait RwLockExt<T> {
    /// The read guard, poisoned or not.
    fn read_guard(&self) -> RwLockReadGuard<'_, T>;
    /// The write guard, poisoned or not.
    fn write_guard(&self) -> RwLockWriteGuard<'_, T>;
}

impl<T> RwLockExt<T> for RwLock<T> {
    fn read_guard(&self) -> RwLockReadGuard<'_, T> {
        self.read().unwrap_or_else(|e| e.into_inner())
    }

    fn write_guard(&self) -> RwLockWriteGuard<'_, T> {
        self.write().unwrap_or_else(|e| e.into_inner())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Proves a mutex a panicking thread held is still usable and still holds what was written before the panic.
    #[test]
    fn a_poisoned_lock_still_hands_over_its_data() {
        let m = std::sync::Arc::new(Mutex::new(vec![1, 2, 3]));

        let poisoner = std::sync::Arc::clone(&m);
        let died = std::thread::spawn(move || {
            let mut held = poisoner.guard();
            held.push(4);
            panic!("while holding the lock");
        })
        .join();
        assert!(died.is_err(), "the thread was supposed to panic");

        assert!(m.lock().is_err(), "and to poison the mutex on the way out");
        assert_eq!(*m.guard(), vec![1, 2, 3, 4]);
    }

    /// The same for a read-write lock: a writer that panicked leaves what it wrote readable and writable.
    #[test]
    fn a_poisoned_rwlock_still_reads_and_writes() {
        let l = std::sync::Arc::new(RwLock::new(1));
        let poisoner = std::sync::Arc::clone(&l);
        let died = std::thread::spawn(move || {
            *poisoner.write_guard() = 2;
            let _held = poisoner.write_guard();
            panic!("while holding the lock");
        })
        .join();
        assert!(died.is_err(), "the thread was supposed to panic");
        assert!(l.read().is_err(), "and to poison the lock on the way out");
        assert_eq!(*l.read_guard(), 2);
        *l.write_guard() = 3;
        assert_eq!(*l.read_guard(), 3);
    }
}

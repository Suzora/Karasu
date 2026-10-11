//! When each background pass runs next, so the sync panel can say what will still happen; memory only, no I/O.

use crate::sync::LockExt;
use std::collections::BTreeMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// One pass as the sync panel shows it.
#[derive(serde::Serialize, specta::Type, Debug, Clone, PartialEq)]
pub struct ScheduledPass {
    /// The pass's own name (`airing`, `site`, `sequel`, `stale`); the frontend maps it to a label.
    pub pass: String,
    /// Until its next run, or none while it is running or switched off.
    #[serde(rename = "dueInMs")]
    #[specta(type = Option<crate::commands::Num>)]
    pub due_in_ms: Option<u64>,
    pub running: bool,
    /// Switched off in Settings; listed anyway, so its absence from the plan is explained rather than unexplained.
    pub off: bool,
}

#[derive(Default, Clone, Copy)]
struct Entry {
    due: Option<Instant>,
    running: bool,
    off: bool,
}

/// The plan as a value, so the ordering and the state changes are testable without the process-wide copy.
#[derive(Default)]
pub struct Schedule {
    passes: BTreeMap<&'static str, Entry>,
}

impl Schedule {
    pub fn plan(&mut self, pass: &'static str, at: Instant) {
        self.passes.insert(pass, Entry { due: Some(at), running: false, off: false });
    }

    pub fn off(&mut self, pass: &'static str) {
        self.passes.insert(pass, Entry { due: None, running: false, off: true });
    }

    pub fn set_running(&mut self, pass: &'static str, running: bool) {
        let e = self.passes.entry(pass).or_default();
        e.running = running;
        if running {
            e.due = None;
            e.off = false;
        }
    }

    /// Running passes first, then by due time, then the ones switched off; a pass never planned is not listed.
    pub fn snapshot(&self, now: Instant) -> Vec<ScheduledPass> {
        let mut out: Vec<ScheduledPass> = self
            .passes
            .iter()
            .map(|(pass, e)| ScheduledPass {
                pass: (*pass).to_string(),
                due_in_ms: if e.running { None } else { e.due.map(|d| d.saturating_duration_since(now).as_millis() as u64) },
                running: e.running,
                off: e.off && !e.running,
            })
            .collect();
        out.sort_by_key(|p| (!p.running, p.off, p.due_in_ms.unwrap_or(u64::MAX)));
        out
    }
}

static PLAN: Mutex<Schedule> = Mutex::new(Schedule { passes: BTreeMap::new() });

/// The pass sleeps for `after` and then runs.
pub fn plan(pass: &'static str, after: Duration) {
    PLAN.guard().plan(pass, Instant::now() + after);
}

/// The pass is switched off and will do nothing at its next wake.
pub fn off(pass: &'static str) {
    PLAN.guard().off(pass);
}

/// Marks the pass running until the guard drops, so a panic inside the run cannot leave it "running" for good.
pub fn running(pass: &'static str) -> RunningGuard {
    PLAN.guard().set_running(pass, true);
    RunningGuard(pass)
}

pub struct RunningGuard(&'static str);

impl Drop for RunningGuard {
    fn drop(&mut self) {
        PLAN.guard().set_running(self.0, false);
    }
}

pub fn snapshot() -> Vec<ScheduledPass> {
    PLAN.guard().snapshot(Instant::now())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_plan_lists_running_first_then_by_due_time_then_the_switched_off() {
        let now = Instant::now();
        let mut s = Schedule::default();
        s.plan("sequel", now + Duration::from_secs(600));
        s.plan("airing", now + Duration::from_secs(60));
        s.off("stale");
        s.set_running("site", true);
        let names: Vec<String> = s.snapshot(now).into_iter().map(|p| p.pass).collect();
        assert_eq!(names, ["site", "airing", "sequel", "stale"]);
    }

    #[test]
    fn a_finished_run_is_neither_running_nor_due_until_it_plans_again() {
        let now = Instant::now();
        let mut s = Schedule::default();
        s.plan("airing", now + Duration::from_secs(5));
        s.set_running("airing", true);
        assert_eq!(
            s.snapshot(now)[0],
            ScheduledPass { pass: "airing".into(), due_in_ms: None, running: true, off: false }
        );
        s.set_running("airing", false);
        assert_eq!(s.snapshot(now)[0].due_in_ms, None);
        assert!(!s.snapshot(now)[0].running);
        s.plan("airing", now + Duration::from_secs(90));
        assert_eq!(s.snapshot(now)[0].due_in_ms, Some(90_000));
    }

    #[test]
    fn an_overdue_pass_reads_as_due_now_rather_than_wrapping() {
        let now = Instant::now();
        let mut s = Schedule::default();
        s.plan("site", now);
        assert_eq!(s.snapshot(now + Duration::from_secs(3))[0].due_in_ms, Some(0));
    }

    #[test]
    fn the_running_guard_clears_the_flag_even_when_the_run_panics() {
        let died = std::panic::catch_unwind(|| {
            let _g = running("guard-test");
            panic!("inside the run");
        });
        assert!(died.is_err());
        let me = snapshot().into_iter().find(|p| p.pass == "guard-test").unwrap();
        assert!(!me.running);
    }
}

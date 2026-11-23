buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:9.3.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.10")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register("clean").configure {
    delete("build")
}

// Hand-added: AGP 9 refuses a plugin compiled below a library it uses, so one below tauri-android's 36 is raised.
subprojects {
    afterEvaluate {
        extensions.findByType(com.android.build.api.dsl.LibraryExtension::class.java)?.let { lib ->
            if ((lib.compileSdk ?: 0) < 36) lib.compileSdk = 36
        }
    }
}

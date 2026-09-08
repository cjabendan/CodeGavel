# CodeGavel: Product Specification

**Version**: 1.0.0  
**Target Environment**: Windows Host / Local Area Network (LAN) Classrooms  
**Primary Domain**: Automated C Programming Hands-On Examinations  

---

## 1. Executive Summary

CodeGavel is an open-source, local-first examination management platform built specifically for evaluating C programming proficiency. It enables computer science instructors to import rosters and problem banks, automatically shuffle assigned coding tasks per student, execute and score C code locally via standard input/output assertions, and enforce strike-based anti-cheat protocols. Designed for reliability in offline lab settings, CodeGavel runs entirely on Windows hosts without cloud dependencies.

---

## 2. Core Functional Modules

### 2.1 Student Roster & Data Ingestion
- **Excel/CSV Parsing**: High-speed parsing of `.xlsx` and `.csv` files containing fields: `student_id`, `full_name`, `year_level`, `section`.
- **Session Provisioning**: Automatic generation of single-use, 6-digit session codes or direct ID lookup for student authentication.
- **Roster Export**: Post-exam data export in `.xlsx` format including full submission history, test case scores, and strike audit logs.

### 2.2 Exam & Problem Bank Engine
- **Multi-Problem Import**: Structured JSON/TXT/Excel file ingestion supporting:
  - Problem statement (Markdown format)
  - Time and memory execution limits
  - Visible sample test cases (input/expected output)
  - Hidden evaluation test cases
- **Fisher-Yates Auto-Shuffling**: When an exam session initializes, the server deterministically shuffles the problem array for each student to prevent neighbor-copying.

### 2.3 C Workspace & Execution Sandbox
- **Monaco Code Editor**: Features C syntax highlighting, line matching, auto-indentation, and configurable font sizing.
- **Local Compilation Pipeline**:
  - Submissions are received over LAN and queued in an execution worker.
  - Code is compiled using standard GCC (`gcc -O2 -wall main.c -o main.exe`).
  - Executable runs under restricted execution timeouts (default: 2.0 seconds per test case) to prevent infinite loops.
  - Detailed output diffing comparing `stdout` against `expected_output`.

### 2.4 Anti-Cheat & Event Monitoring System
- **Real-Time Signal Detection**: Client-side event tracking for window blur, tab switching, mouse boundary exit, and DevTools keyboard shortcuts.
- **Coalescing Engine**: 1-second time-window deduplication on the server to handle duplicate browser events.
- **Atomic Lockout**: At 3 accumulated strikes, the server immediately locks the attempt, captures the current buffer, and marks the session status as `locked_strike`.

### 2.5 Teacher Command & Control Center
- **Live Roster Dashboard**: Real-time status indicators (Offline, Active, Strikes 1-2, Locked, Submitted).
- **Session Governance**: One-click actions to:
  - Pause/Resume group attempts (blocks editor lookup and inputs instantly).
  - Clear student strikes with audit field annotations.
  - Reset individual student attempts.
  - Extend exam duration dynamically for individual students or entire sections.

---

## 3. Data Model Schema Summary

```text
students
├── id (string, PK)
├── student_id (string, indexed)
├── full_name (string)
├── year_level (string)
└── section (string)

problems
├── id (string, PK)
├── title (string)
├── description (markdown)
├── memory_limit_mb (number)
├── time_limit_sec (number)
└── test_cases (json: array of {input, expected_output, is_hidden})

exam_sessions
├── id (string, PK)
├── student_id (relation -> students)
├── group_code (string)
├── assigned_problem_id (relation -> problems)
├── current_code (text)
├── strike_count (number)
├── status (enum: active, paused, locked, submitted)
├── started_at (datetime)
└── submitted_at (datetime)

strike_logs
├── id (string, PK)
├── session_id (relation -> exam_sessions)
├── event_type (string: blur, visibility, devtools, mouse_leave)
├── client_event_id (string, unique)
└── created_at (datetime)
```

---

## 4. Non-Functional Requirements & Performance Targets

- **Concurrency**: Supports up to 100 simultaneous active student connections on a standard Windows 10/11 desktop host (Intel Core i5, 16GB RAM).
- **Latency**: Code evaluation response time $\le 1.5$ seconds for standard C problems under continuous load.
- **Offline Integrity**: Zero network requests to public external CDNs or external APIs during execution.

# CodeGavel: Anti-Cheat Architecture & Security Boundary

## Overview

CodeGavel’s anti-cheat framework acts as a **classroom monitoring signal and automated lockout mechanism**. It is designed to deter unauthorized resource access, detect off-application movement, and automatically freeze test instances upon violation thresholds.

It is **not** a kernel-level driver or secure kiosk browser; rather, it provides deterministic enforcement bounded by what standard modern browser environments allow.

---

## Toggle Semantics & State Governance

- **Default State**: Anti-cheat enforcement is enabled by default for every new exam group.
- **Server-Driven Authority**: The PocketBase backend maintains the absolute state of anti-cheat settings. The client browser queries or receives active policy state during strike transaction processing.
- **Live Propagation**: Settings changes take effect immediately across all open student terminals via Server-Sent Events (SSE) without requiring a browser refresh.
- **Retention of Records**: Disabling anti-cheat pauses strike incrementation but **retains historical strike records**. Re-enabling anti-cheat resumes from the previously stored strike count.
- **Lockout Retention**: An attempt locked due to reaching the strike threshold remains locked even if anti-cheat is toggled off. Unlocking requires explicit teacher intervention.

---

## Application-Level Mitigations

| Vulnerability / Risk          | Mitigation Mechanism       | Technical Implementation                                                                                                                                  |
| :---------------------------- | :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Duplicate Event Spams**     | Server-Side Coalescing     | Events received from the same session within **1000ms** are merged into a single strike record.                                                           |
| **Network Retry Duplication** | Idempotency Keys           | Client generates a unique UUID (`client_event_id`) per physical event. Re-sent requests with identical IDs are acknowledged without incrementing strikes. |
| **Stale Client Policy**       | Transactional Verification | Strike evaluation occurs inside a server transaction that checks current group policy before committing increments.                                       |
| **Evidence Tampering**        | Immutable Audit Trail      | Strike logs are append-only. Clearing a strike by a teacher marks `is_cleared=true` and logs the teacher ID without deleting the original event row.      |
| **Client Code Injection**     | Stripped Sandbox Editor    | Student inputs are strictly text buffers. HTML execution, script execution, and browser extension interaction inside the editor container are restricted. |
| **Race Condition Saves**      | Latest-Wins Sequencing     | Code auto-saves utilize timestamped sequence tracking. Out-of-order delayed network frames are safely discarded.                                          |

---

## Hardware & Browser Limitations (Out of Scope)

The table below outlines technical boundaries that standard browser-based JavaScript cannot close without OS-level or managed-hardware intervention:

| Hard Limitation                                    | Recommended Practical Solution                                                                                               |
| :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Student disables JavaScript or manipulates DOM** | Deploy school-managed devices with enterprise policies locking DevTools and extension settings.                              |
| **DevTools opened via browser menu**               | Enforce Chrome/Edge Group Policy (`DeveloperToolsAvailability = 2`). Keyboard hooks cannot catch menu-driven opens reliably. |
| **Alt+Tab / Secondary OS Windows**                 | Utilize Windows Kiosk Mode or Single App Shell policies. Web APIs cannot intercept OS system shortcuts directly.             |
| **External Physical Devices / Mobile Phones**      | Physical classroom proctoring and clear line-of-sight seating arrangements.                                                  |

---

## Prohibited Heuristics

CodeGavel **explicitly avoids** using the following unreliable heuristics:

- **Window Resize / Zoom Detection**: Triggers high false positives for students utilizing screen magnifiers or accessibility scaling options.
- **Debugger Timers (`debugger` loops)**: Easily bypassed by seasoned students and degrades general editor performance.
- **Performance/FPS Benchmarking**: Produces false strikes on lower-spec classroom PCs undergoing CPU throttling.

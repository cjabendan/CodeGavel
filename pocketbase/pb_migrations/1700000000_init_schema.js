migrate((app) => {
  // 1. Create 'sections' Collection
  const sections = new Collection({
    name: "sections",
    type: "base",
    fields: [
      { name: "section_name", type: "text", required: true },
      { name: "year_level", type: "text", required: true },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(sections);

  // 2. Create 'groups' Collection
  const groups = new Collection({
    name: "groups",
    type: "base",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "code", type: "text", required: true },
      {
        name: "section",
        type: "relation",
        required: true,
        collectionId: sections.id,
        maxSelect: 1,
      },
      { name: "default_time_limit_min", type: "number", required: true, min: 1, max: 180 },
      { name: "anti_cheat_enabled", type: "bool", required: false },
      {
        name: "status",
        type: "select",
        required: true,
        values: ["lobby", "active", "ended"],
        maxSelect: 1,
      },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_group_code ON groups (code)"],
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(groups);

  // 3. Create 'problems' Collection
  const problems = new Collection({
    name: "problems",
    type: "base",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "description", type: "text", required: true },
      { name: "time_limit_sec", type: "number", required: true, min: 0.1, max: 30 },
      { name: "memory_limit_mb", type: "number", required: true, min: 8, max: 512 },
      { name: "test_cases", type: "json", required: true },
    ],
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(problems);

  // 4. Create 'exam_sessions' Collection
  const examSessions = new Collection({
    name: "exam_sessions",
    type: "base",
    fields: [
      { name: "student_name", type: "text", required: true },
      {
        name: "group",
        type: "relation",
        required: true,
        collectionId: groups.id,
        maxSelect: 1,
      },
      { name: "group_code", type: "text", required: true },
      {
        name: "assigned_problem",
        type: "relation",
        required: true,
        collectionId: problems.id,
        maxSelect: 1,
      },
      { name: "current_code", type: "text", required: false },
      { name: "time_limit_min", type: "number", required: true, min: 1, max: 300 },
      { name: "strike_count", type: "number", required: false, min: 0, max: 10 },
      {
        name: "status",
        type: "select",
        required: true,
        values: ["waiting", "active", "paused", "locked_strike", "submitted", "timeout"],
        maxSelect: 1,
      },
      {
        name: "execution_status",
        type: "select",
        required: false,
        values: ["idle", "pending", "running", "completed", "passed", "failed", "compile_error", "error"],
        maxSelect: 1,
      },
      { name: "terminal_output", type: "text", required: false },
      { name: "time_started", type: "date", required: false },
      { name: "time_ended", type: "date", required: false },
    ],
    indexes: ["CREATE INDEX idx_session_group ON exam_sessions (group_code)"],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(examSessions);
}, (app) => {
  ["exam_sessions", "problems", "groups", "sections"].forEach((name) => {
    const col = app.findCollectionByNameOrId(name);
    if (col) app.delete(col);
  });
});
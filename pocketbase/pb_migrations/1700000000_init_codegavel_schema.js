migrate((db) => {
  const dao = new Dao(db);

  // 1. Create 'students' Collection
  const studentsCollection = new Collection({
    name: "students",
    type: "base",
    system: false,
    schema: [
      {
        name: "student_id",
        type: "text",
        required: true,
        options: { min: 1, max: 50 }
      },
      {
        name: "full_name",
        type: "text",
        required: true,
        options: { min: 1, max: 150 }
      },
      {
        name: "year_level",
        type: "text",
        required: false,
        options: { min: 0, max: 20 }
      },
      {
        name: "section",
        type: "text",
        required: false,
        options: { min: 0, max: 50 }
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_student_id ON students (student_id)"
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  dao.saveCollection(studentsCollection);

  // 2. Create 'problems' Collection
  const problemsCollection = new Collection({
    name: "problems",
    type: "base",
    system: false,
    schema: [
      {
        name: "title",
        type: "text",
        required: true,
        options: { min: 1, max: 200 }
      },
      {
        name: "description",
        type: "text",
        required: true
      },
      {
        name: "time_limit_sec",
        type: "number",
        required: true,
        options: { min: 0.1, max: 30 }
      },
      {
        name: "memory_limit_mb",
        type: "number",
        required: true,
        options: { min: 8, max: 512 }
      },
      {
        name: "test_cases",
        type: "json",
        required: true
      }
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  dao.saveCollection(problemsCollection);

  // 3. Create 'exam_sessions' Collection
  const examSessionsCollection = new Collection({
    name: "exam_sessions",
    type: "base",
    system: false,
    schema: [
      {
        name: "student_id",
        type: "relation",
        required: true,
        options: {
          collectionId: studentsCollection.id,
          cascadeDelete: false,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: "assigned_problem_id",
        type: "relation",
        required: true,
        options: {
          collectionId: problemsCollection.id,
          cascadeDelete: false,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: "group_code",
        type: "text",
        required: true,
        options: { min: 1, max: 50 }
      },
      {
        name: "current_code",
        type: "text",
        required: false
      },
      {
        name: "strike_count",
        type: "number",
        required: false,
        options: { min: 0, max: 10 }
      },
      {
        name: "status",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["active", "paused", "locked_strike", "submitted"]
        }
      },
      {
        name: "started_at",
        type: "date",
        required: false
      },
      {
        name: "submitted_at",
        type: "date",
        required: false
      }
    ],
    indexes: [
      "CREATE INDEX idx_group_code ON exam_sessions (group_code)"
    ],
    listRule: "", // Accessible via custom API rules or client SSE
    viewRule: "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  dao.saveCollection(examSessionsCollection);
}, (db) => {
  const dao = new Dao(db);

  const examSessions = dao.findCollectionByNameOrId("exam_sessions");
  if (examSessions) dao.deleteCollection(examSessions);

  const problems = dao.findCollectionByNameOrId("problems");
  if (problems) dao.deleteCollection(problems);

  const students = dao.findCollectionByNameOrId("students");
  if (students) dao.deleteCollection(students);
});
/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_808513361");

    // add field
    collection.fields.addAt(
      12,
      new Field({
        help: "",
        hidden: false,
        id: "date2432035226",
        max: "",
        min: "",
        name: "paused_at",
        presentable: false,
        required: false,
        system: false,
        type: "date",
      }),
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_808513361");

    // remove field
    collection.fields.removeById("date2432035226");

    return app.save(collection);
  },
);

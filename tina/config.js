import { defineConfig } from "tinacms";

const branch =
  process.env.TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  "main";

export default defineConfig({
  branch,
  // Get from https://app.tina.io
  clientId: process.env.TINA_PUBLIC_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    // Outputs the admin UI to public/admin so Vite copies it to dist/admin
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "assets/uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      {
        label: "Portfolio Quests",
        name: "portfolio",
        path: "public/content",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "quests",
        },
        fields: [
          {
            type: "object",
            name: "quests",
            label: "Quests",
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.title || "Quest",
              }),
            },
            fields: [
              {
                type: "string",
                name: "id",
                label: "Quest ID (no spaces, lowercase)",
                required: true,
              },
              {
                type: "string",
                name: "title",
                label: "Project Title",
                required: true,
              },
              {
                type: "string",
                name: "system",
                label: "System Name (e.g. SYSTEM.EXE)",
              },
              {
                type: "string",
                name: "subtitle",
                label: "Subtitle (e.g. STAGE 01 // ...)",
              },
              {
                type: "image",
                name: "thumbnail",
                label: "Thumbnail Image",
              },
              {
                type: "string",
                name: "challenge",
                label: "The Challenge",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "solution",
                label: "The Solution",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "image",
                name: "images",
                label: "Gallery Images",
                list: true,
              },
              {
                type: "string",
                name: "stack",
                label: "Tech Stack (one per item)",
                list: true,
              },
              {
                type: "object",
                name: "metrics",
                label: "Key Metrics",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.label || "Metric",
                  }),
                },
                fields: [
                  {
                    type: "string",
                    name: "label",
                    label: "Label (e.g. Approval Speed)",
                  },
                  {
                    type: "string",
                    name: "value",
                    label: "Value (e.g. +45%)",
                  },
                  {
                    type: "string",
                    name: "desc",
                    label: "Description",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});

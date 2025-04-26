const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Định nghĩa các options cho Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "GearUp API",
      version: "1.0.0",
      description: "GearUp E-commerce API Documentation",
      contact: {
        name: "Team GearUp",
        email: "support@gearup.com",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://gearup-api.com"
            : "http://localhost:5000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Đường dẫn đến các file chứa JSDoc annotations
  apis: ["./swagger/*.js", "./routes/*.js"],
};

// Khởi tạo Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Hàm thiết lập Swagger cho Express app
const setupSwagger = (app) => {
  // URL để truy cập Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "GearUp API Documentation",
    })
  );

  console.log(
    `Swagger documentation available at http://localhost:${
      process.env.PORT || 5000
    }/api-docs`
  );
};

module.exports = { setupSwagger };

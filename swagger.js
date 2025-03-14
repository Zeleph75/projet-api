import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API de Gestion des Utilisateurs et Salons",
            version: "1.0.0",
            description: "Documentation de l'API avec Swagger",
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Serveur Local",
            },
        ],
    },
    apis: ["./server.js"], // Indique où Swagger doit chercher les routes
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;

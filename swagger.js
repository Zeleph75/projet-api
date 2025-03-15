import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Spotify API",
            version: "1.0.0",
            description: "Documentation de l'API Spotify Clone",
        },
        servers: [{ url: "http://localhost:5000" }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./server.js"], // Assure-toi que le chemin correspond
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

export { swaggerDocs, swaggerUI };

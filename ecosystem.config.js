module.exports = {
    apps: [{
        name: "edu-api",
        script: "app.js",
        env: {
            NODE_ENV: "development"
        },
        env_production: {
            NODE_ENV: "production"
        }
    }]
}

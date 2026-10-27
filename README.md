<!-- @format -->

# Roman Rai Culinary Portfolio

A responsive portfolio served by Java 17+ and Spring Boot. The public page reads profile, kitchen experience, skills, and dishes from the Java API. The admin can sign in to update that content and upload photos.

## Start locally

1. Copy `.env.example` to `.env` and set a private admin username and password (at least 12 characters).
2. In Terminal, load the environment and start the app:

```sh
set -a
source .env
set +a
mvn spring-boot:run
```

3. Open `http://localhost:8080`. Admin sign-in is at `http://localhost:8080/admin` (also linked discreetly in the portfolio footer).

## Live Server Preview

Run `npm install` before opening `culinary_art_in_motion.html` with VS Code Live Server. Three.js is served from `node_modules` on port 5500; the complete dynamic portfolio and admin API require the Spring Boot server above.

Never commit `.env` or share the admin password. For production, use HTTPS and keep `PORTFOLIO_DATA_DIR` on persistent storage. Portfolio content and uploaded images are stored under `data/` by default. The first launch creates starter profile data; add real venues, dates, contact details, and your own photography before publishing.

## Project layout

- `src/main/java/` Java server, API, persistence, and authentication
- `src/main/resources/static/` public and admin pages plus CSS, JS, and image assets
- `data/portfolio.json` editable portfolio content (generated on first launch)
- `data/uploads/` images uploaded in Admin
- `culinary_art_in_motion.html` original standalone prototype

# DecisionVault

> An expert decision replay platform designed to capture, organize, and replay the reasoning behind important decisions.

DecisionVault is a backend-focused project that aims to preserve not only the outcome of a decision, but also the **context, reasoning, evidence, and process** that led to it. The goal is to make expert decision-making easier to understand, revisit, and learn from.

## 🚧 Project Status

**In development**

The project is currently being built incrementally, starting with the backend and core API structure.

## 🎯 Problem

Important decisions are often documented as conclusions without documenting **how the conclusion was reached**.

This makes it difficult to:

* Revisit the reasoning behind a past decision
* Understand which evidence influenced the outcome
* Learn from expert decision-making processes
* Compare decisions made in different situations
* Replay a decision later with the original context

## 💡 Solution

DecisionVault is intended to provide a structured way to store and replay decisions.

A decision can be represented through its:

* **Context** — what situation led to the decision
* **Factors** — the important variables considered
* **Evidence** — supporting information and inputs
* **Reasoning** — why one option was preferred over another
* **Outcome** — what eventually happened
* **Replay** — the ability to revisit the decision-making process

## 🏗️ Current Architecture

```text
DecisionVault
│
├── Backend
│   ├── Node.js
│   ├── Express.js
│   ├── REST API
│   ├── Environment configuration
│   └── Database layer
│
└── Frontend
    └── Planned
```

### Backend Structure

```text
backend/
├── src/
│   ├── db/
│   │   └── db.js
│   └── app.js
├── server.js
├── package.json
├── package-lock.json
└── .env
```

The application entry point is `server.js`, while the Express application and database-related code are organized under `src/`.

## 🛠️ Tech Stack

### Backend

* **Node.js** — JavaScript runtime
* **Express.js** — Web framework for the API
* **MongoDB** — Database layer
* **dotenv** — Environment variable management

### Development

* **Git & GitHub** — Version control and collaboration
* **npm** — Package management

## 🚀 Getting Started

### 1. Clone the repository

The project is maintained using separate branches for each contributor.

To work with the **Karan-Saini implementation**, clone the repository and switch to the `Karan-Saini` branch:

```bash
git clone https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git
cd Expert-Decision-Replay-Platform
git checkout Karan-Saini
```

### 2. Move into the backend

```bash
cd backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the **repository root** and add the required configuration, for example:

```env
PORT=4000
```

Add any database or service credentials required by your local setup as additional environment variables.

> **Never commit your `.env` file to GitHub.**

### 5. Start the backend

For development:

```bash
npm run dev
```

Or, depending on the scripts configured in `package.json`:

```bash
npm start
```

The server will start on the port configured in `.env`.

## 🔌 API

The API layer is being developed around the core concepts of the platform, such as decisions, context, evidence, reasoning, and outcomes.

API documentation will be added as the endpoints are finalized.

## 🌱 Planned Features

* Decision creation and management
* Structured decision context
* Evidence and factor tracking
* Decision reasoning capture
* Decision replay
* Outcome tracking
* Expert decision analysis
* Search and filtering
* Authentication and authorization
* Frontend dashboard

## 🤝 Collaboration

This project is developed collaboratively using GitHub branches.

Each contributor works on their own branch and creates a pull request when their work is ready for review and merging.

### Example workflow

```bash
git fetch origin
git checkout your-branch-name
git add .
git commit -m "Describe your change"
git push
```

For example, for the `Karan-Saini` branch:

```bash
git fetch origin
git checkout Karan-Saini
git add .
git commit -m "Add backend setup"
git push
```

## 🔐 Environment Variables

The following variables are expected to be configured locally:

| Variable      | Description                     | Required                             |
| ------------- | ------------------------------- | ------------------------------------ |
| `PORT`        | Port used by the backend server | Yes                                  |
| `MONGODB_URI` | MongoDB connection string       | When database integration is enabled |

Additional variables may be added as the project develops.

## 📌 Roadmap

* [x] Initialize backend project
* [x] Set up Express application
* [x] Configure environment variables
* [ ] Complete database integration
* [ ] Build core decision APIs
* [ ] Implement decision replay functionality
* [ ] Add authentication
* [ ] Build frontend
* [ ] Connect frontend and backend
* [ ] Add testing and API documentation

## 👨‍💻 Contributors

This project is being developed as a collaborative team project.

Each contributor maintains their work on a dedicated GitHub branch.

## 📄 License

License information will be added when the project is finalized.

1. Run the server

```cmd
docker compose up --build

- Run with scaling
docker compose up --scale fastapi_app=3
```

## Run services

Start both the backend and frontend:

```sh
make run-all
```

Run only the backend:

```sh
make run-backend
```

The frontend is available at `http://localhost:5173` and proxies API requests to the backend on port 80. Stop the running services with `Ctrl+C`.

2. Run the seeder(from your project root,outside src dir)

```cmd
python3 -m src.scripts.seeder all
```

3. Run migration

```cmd
alembic init migrations
alembic revision --autogenerate -m "some comment"
alembic upgrade head
```

4. Test Scaling

```cmd
python3 test-load-balancer.py
```
### Todo

- [x] Setup Postgresql db with docker
- [x] How to generate migration file
- [x] How to create seeder script
- [x] Auth with JWT
- [x] Middleware(dependency injection)
- [x] Proper structure
- [x] Reload every time something changes in file in docker version
- [x] Issue ⇒ Cant find db at first => solved with restart
- [x] Configured load balancer with nginx.
- [x] Configured Prometheus,Grafana,Loki.
- [x] Configured alerting in Prometheus with MS-Teams.

## Project structure
```md
DevOps_Play/
│
├── services/
│   ├── user-management/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   ├── alembic.ini
│   │   ├── alembic/
│   │   │   └── versions/
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py
│   │   │   │   ├── security.py          # JWT creation/validation
│   │   │   │   └── middleware.py        # Logging, metrics, auth
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   └── database.py          # PostgreSQL connection
│   │   │   ├── user/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── services.py
│   │   │   │   └── views.py             # Auth, register, login, user CRUD
│   │   │   ├── scripts/
│   │   │   │   ├── __init__.py
│   │   │   │   └── seeder.py
│   │   │   └── observability/
│   │   │       ├── __init__.py
│   │   │       ├── tracing.py           # OpenTelemetry
│   │   │       ├── logging.py           # Loki handler
│   │   │       └── metrics.py           # Prometheus metrics
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_auth.py
│   │       └── test_users.py
│   │
│   └── note-service/
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── .env.example
│       ├── src/
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── core/
│       │   │   ├── __init__.py
│       │   │   ├── config.py
│       │   │   ├── security.py          # JWT validation (same secret as user service)
│       │   │   └── middleware.py        # Auth verification, logging, metrics
│       │   ├── db/
│       │   │   ├── __init__.py
│       │   │   └── database.py          # MongoDB connection
│       │   ├── note/
│       │   │   ├── __init__.py
│       │   │   ├── models.py            # Pydantic models (not SQLModel)
│       │   │   ├── schemas.py
│       │   │   ├── services.py
│       │   │   └── views.py             # Note CRUD endpoints
│       │   ├── scripts/
│       │   │   ├── __init__.py
│       │   │   └── seeder.py
│       │   └── observability/
│       │       ├── __init__.py
│       │       ├── tracing.py
│       │       ├── logging.py
│       │       └── metrics.py
│       └── tests/
│           ├── __init__.py
│           └── test_notes.py
│
├── infrastructure/
│   ├── nginx/
│   │   ├── nginx.conf                   # API Gateway configuration
│   │   └── Dockerfile (optional)
│   ├── observability/
│   │   ├── prometheus/
│   │   │   ├── prometheus.yml
│   │   │   └── alert-rules.yml
│   │   ├── grafana/
│   │   │   ├── grafana.yml
│   │   │   └── dashboards/
│   │   ├── loki/
│   │   │   └── loki.yml
│   │   ├── tempo/
│   │   │   └── tempo.yml
│   │   └── alertmanager/
│   │       └── alertmanager.yml
│   └── docker/
│       └── docker-compose.yml           # Main orchestration
│
├── scripts/
│   ├── start-all.sh                     # Start all services
│   ├── stop-all.sh                      # Stop all services
│   ├── build-all.sh                     # Build all Docker images
│   ├── start-user-service.sh            # Start only user service
│   ├── start-note-service.sh            # Start only note service
│   └── health-check.sh                  # Check all services health
│
├── shared/                              # Shared utilities (optional)
│   ├── __init__.py
│   └── jwt_utils.py                     # Shared JWT configuration
│
├── .env.example                         # Example environment variables
├── .gitignore
├── README.md
└── sonar-project.properties
```
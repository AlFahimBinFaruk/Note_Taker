## Project structure
```md
Note_Taker
    - services
        - user-management
        - monitoring(these will have all the logging,monitoring,tracing)
        - note-management
        - service-discovery(this will contain the nginx configuration)
```

1. Make the "run.sh" runnable
```cmd
chmod +x run.sh
# to run just execute: run.sh
```

1. Run the server

```cmd
docker compose up --build

- Run with scaling
docker compose up --scale fastapi_app=3
```

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
- [] Shell script for up/down all services at once.


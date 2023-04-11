start:
	go run -tags musl ./cmd/main

# DO NOT RUN
build-push-dpl:
	docker build --tag "petarcvit223/cicops:latest" .
	docker push petarcvit223/cicops
	kubectl apply -f k8s/deployment.yaml

local-redis:
	docker-compose up --detach

stop:
	docker-compose down

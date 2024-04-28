FROM golang:1.21-alpine as build

WORKDIR /build

COPY go.mod ./
RUN go mod download
RUN go mod tidy

COPY ./ ./

RUN mkdir /build/bin
RUN go build -o /build/bin ./...

FROM alpine:3.19.0

WORKDIR /app

RUN mkdir /app/bin

COPY --from=build /build/bin/main /app/bin/ctrl



CMD ["/app/bin/ctrl"]

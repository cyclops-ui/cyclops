FROM golang:1.16-alpine

WORKDIR /app

RUN apk add curl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin


COPY go.mod ./
#COPY go.sum ./
RUN go mod download

COPY ./ ./

CMD go run -tags musl ./cmd/main

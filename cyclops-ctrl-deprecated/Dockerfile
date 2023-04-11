FROM golang:1.17-alpine

WORKDIR /app

RUN apk add curl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin

COPY go.mod ./
RUN go mod download
RUN go mod tidy

COPY ./ ./

RUN mkdir /app/bin
RUN go build -o /app/bin ./...
RUN ls
RUN ls ..

CMD ["/app/bin/main"]

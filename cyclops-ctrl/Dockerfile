FROM golang:1.19-alpine

WORKDIR /app

COPY go.mod ./
RUN go mod download
RUN go mod tidy

COPY ./ ./

RUN mkdir /app/bin
RUN go build -o /app/bin ./...
RUN ls
RUN ls ..

CMD ["/app/bin/main"]

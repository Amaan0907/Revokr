FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o worker ./cmd/worker

FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates

COPY --from=builder /app/worker .

# No EXPOSE: the worker only polls SQS, it serves no HTTP.
CMD ["./worker"]

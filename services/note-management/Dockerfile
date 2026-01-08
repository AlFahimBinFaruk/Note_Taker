# Builder Stage
FROM golang:1.25.5-alpine AS builder

WORKDIR /app

# Copy mod files first for better caching.
COPY go.mod go.sum ./

# Download the moduels
RUN go mod download

# Copy source code(with downloaded modules)
COPY . .


# Build the binary
# CGO_ENABLED=0: Disable cgo, If CGO were left on (enabled), 
#   the Go build might produce a binary that depends on the host’s C toolchain 
#   and external libraries — which often leads to runtime errors in lightweight containers.
#   if it's of then The binary becomes fully static (no dynamic linking to libc or other shared libraries).

# GOOS=linux: Build for linux

# -o main: Output the binary as main, means the final executable binary will be in a file named "main"
RUN CGO_ENABLED=0 GOOS=linux go build -o main .


# Runtime Stage

# "Alpine" is just an lightweight Linux OS(<=5mb), as our final output from build stage is just an
# binary executable file we can use linux os to run it.
FROM alpine:3.21

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/main .


EXPOSE 8000

CMD ["./main"]
# Fix for Docker commands in Cursor IDE
docker() {
  (
    # Temporarily unset Python environment variables
    unset PYTHONHOME
    unset PYTHONPATH
    # Run the actual docker command
    command docker "$@"
  )
}

docker-compose() {
  (
    # Temporarily unset Python environment variables
    unset PYTHONHOME
    unset PYTHONPATH
    # Run the actual docker-compose command
    command docker-compose "$@"
  )
} 
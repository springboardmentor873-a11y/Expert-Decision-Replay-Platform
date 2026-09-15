function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="error-message">
      <strong>Something went wrong</strong>
      <p>{message}</p>
    </div>
  );
}

export default ErrorMessage;
type StatusMessageProps = {
  type: "success" | "error" | "info";
  children: React.ReactNode;
};

export function StatusMessage({ type, children }: StatusMessageProps) {
  return (
    <div className={`status-message status-${type}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

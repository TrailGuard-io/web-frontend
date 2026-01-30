import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./login";

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../store/user", () => {
  const store = { setToken: vi.fn(), token: null };
  return {
    useUserStore: (selector: any) => selector(store),
  };
});

vi.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("LoginPage", () => {
  it("renders login form fields", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});

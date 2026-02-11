import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "../pages/login";

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next-i18next/serverSideTranslations", () => ({
  serverSideTranslations: async () => ({}),
}));

vi.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("LoginPage", () => {
  it("renders social login buttons with icons", () => {
    render(<LoginPage />);

    expect(screen.getByText("continue_with_google")).toBeInTheDocument();
    expect(screen.getByText("continue_with_facebook")).toBeInTheDocument();

    expect(screen.getByTestId("google-icon")).toBeInTheDocument();
    expect(screen.getByTestId("facebook-icon")).toBeInTheDocument();
  });
});

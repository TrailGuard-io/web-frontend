import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "./Header";

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: "/dashboard",
    query: {},
    locale: "es",
  }),
}));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Header", () => {
  it("renders brand and nav items", () => {
    render(<Header />);
    expect(screen.getByText("TrailGuard")).toBeInTheDocument();
    expect(screen.getByText(/dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/rescue/)).toBeInTheDocument();
  });
});

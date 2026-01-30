import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "../../pages/index";

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt || "image"} />,
}));

vi.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Home", () => {
  it("renders CTA button", () => {
    render(<Home />);
    expect(screen.getByText("TrailGuard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login_button/i })).toBeInTheDocument();
  });
});

import "server-only";

import type { DemoUser } from "@/lib/types";

export const demoUsers: DemoUser[] = [
  {
    id: "user_admin_demo",
    role: "ADMIN",
    name: "Transfer Pro Admin",
    email: "admin@transferpro.test",
    password: "demo1234",
    phone: "+1 416 555 2201"
  },
  {
    id: "user_driver_demo",
    role: "DRIVER",
    name: "Transfer Pro Driver",
    email: "driver@transferpro.test",
    password: "demo1234",
    phone: "+1 416 555 2202"
  },
  {
    id: "user_customer_demo",
    role: "CUSTOMER",
    name: "Lena Hart",
    email: "customer@transferpro.test",
    password: "demo1234",
    phone: "+44 20 7946 0991"
  }
];

export function isDemoAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_MODE === "true";
}

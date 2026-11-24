import { getAuth, clerkClient } from "@clerk/express";
import { sql } from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    const auth = getAuth(req);

    const userId = auth?.userId || req.auth?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Not authorized, authentication required!" });
    }

    req.user = { id: userId };

    let userActivePlan = "free";
    try {
      if (auth?.has && typeof auth.has === "function" && auth.has({ plan: "premium" })) {
        userActivePlan = "premium";
      }
    } catch {
      userActivePlan = "free";
    }

    const users = await sql`SELECT id, name, email, plan FROM users WHERE id = ${userId}`;

    if (users.length === 0) {
      let name = "User";
      let email = `${userId}@clerk.user`;
      let image = "";

      try {
        const client = req.clerk || clerkClient;
        const clerkUser = await client.users.getUser(userId);
        name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "User";
        email = clerkUser.emailAddresses?.[0]?.emailAddress || email;
        image = clerkUser.imageUrl || "";
      } catch (err) {
        console.warn("Could not retrieve user info from Clerk API, using fallback:", err.message);
      }

      await sql`
        INSERT INTO users (id, name, email, image, plan)
        VALUES (${userId}, ${name}, ${email}, ${image}, ${userActivePlan})
        ON CONFLICT (id) DO UPDATE SET
          plan = EXCLUDED.plan,
          updated_at = NOW()
      `;
    } else {
      const userPlan = users[0]?.plan;
      if (userActivePlan !== userPlan) {
        await sql`UPDATE users SET plan = ${userActivePlan} WHERE id = ${userId}`;
      }
    }

    next();
  } catch (error) {
    console.error("Auth protect middleware error:", error);
    next(error);
  }
};
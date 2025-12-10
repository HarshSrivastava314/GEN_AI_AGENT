import { inngest } from "../client.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 3 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      const { email } = event.data;

      // 1. Get user
      const user = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email });
        if (!userObject) {
          throw new NonRetriableError(
            "User no longer exists in our database"
          );
        }
        return userObject;
      });

      // 2. Send welcome email
      await step.run("send-welcome-email", async () => {
        const subject = "Welcome to the app";

        const message = `
        Hi ${user.name || ""},
        
        Thanks for signing up. We are glad to have you onboard!
        `;

        await sendMail(user.email, subject, message);
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Error running step", error.message);
      return { success: false };
    }
  }
);

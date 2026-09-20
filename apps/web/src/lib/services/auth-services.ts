import { pb } from "@/lib/pocketbase";

export const authService = {
  /**
   * Authenticates a superuser/admin with email and password
   */
  async loginAdmin(email: string, pass: string) {
    return await pb.collection("_superusers").authWithPassword(email, pass);
  },

  /**
   * Clears active authentication token from memory/storage
   */
  logout() {
    pb.authStore.clear();
  },

  /**
   * Checks if current session belongs to a valid superuser/admin
   */
  isLoggedIn() {
    if (!pb.authStore.isValid) return false;

    // Checks for superuser record or legacy admin model
    const isSuperuserRecord = pb.authStore.record?.collectionName === "_superusers";
    return pb.authStore.isAdmin || pb.authStore.isSuperuser || isSuperuserRecord;
  },
};

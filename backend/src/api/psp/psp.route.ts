import { CinetPayClient } from "@/core/payments/cinet-pay/cinet-pay";
import { syncPaymentStatusByReference } from "@/utils/functions/sync-paiment-status";
import { Request, Response, Router } from "express";
import { container } from "tsyringe";

const router: Router = Router();

const cinetpayService = container.resolve(CinetPayClient);

router.post("/cinetpay", async (req: Request, res: Response) => {
  try {
    const xToken = (req.headers["x-token"] as string | undefined) ?? undefined;
    const ok = cinetpayService.verifyWebhookSignature(req.body, xToken);
    if (!ok) {
      return res.status(400).json({ error: "BAD_SIGNATURE" });
    }

    const reference =
      req.body?.cpm_trans_id ||
      req.body?.transaction_id ||
      req.body?.data?.transaction_id ||
      req.body?.reference;

    if (reference) {
      await syncPaymentStatusByReference(reference);
    }
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(200);
  }
});

export default router;

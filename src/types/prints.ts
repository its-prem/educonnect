export type PrintPdf = {
  id: string
  title: string
  pricePerCredit: number
  enabled: boolean
  createdAt: string
  updatedAt?: string | null
  hasFile?: boolean
  fileMissing?: boolean
}

export type PrintPurchase = {
  id: string
  studentId: string
  studentName?: string | null
  studentEmail?: string
  pdfId: string
  pdfTitle?: string | null
  creditsTotal: number
  creditsUsed: number
  remaining: number
  amountPaid: number
  status: string
  purchasedAt: string
}

export type PrintLog = {
  id: string
  studentName: string
  pdfName: string
  printNumber: number
  printedAt: string
  printerName: string
  remainingCredits: number
  studentId?: string
  purchaseId?: string
}

export type PrintOrder = {
  id: string
  cashfreeOrderId: string
  paymentSessionId: string
  amount: number
  credits: number
  pdfId: string
  pdfTitle: string
  mock: boolean
  status: string
}

# Payment Missing Issues - Root Cause Analysis

## Issues Identified

### 1. **Webhook Dependency on Order Notes** ⚠️ CRITICAL
**Location**: `src/app/api/payment/razorpay/webhook/route.ts` (Line 56-60)

**Problem**: 
- Webhook requires `eventId` to be in `order.notes`
- If notes are missing or not properly set, webhook fails silently
- Returns 200 status, so Razorpay doesn't retry

**Impact**: Payments captured by Razorpay but not recorded in DB

### 2. **Frontend Verification Failure** ⚠️ HIGH
**Location**: `src/components/razorpay-payment.tsx` (Line 269-278)

**Problem**:
- If frontend verification fails (network error, timeout, etc.)
- Payment is already captured by Razorpay
- Error is logged but payment not recorded
- No automatic retry mechanism

**Impact**: User pays but ticket not created

### 3. **Missing Customer Email in Webhook** ⚠️ HIGH
**Location**: `src/app/api/payment/razorpay/webhook/route.ts` (Line 74-80)

**Problem**:
- Webhook needs customer email to create user
- If email not in payment/order data, webhook fails silently
- Returns 200, preventing retry

**Impact**: Payments without email in Razorpay data are lost

### 4. **No Order Data Persistence** ⚠️ MEDIUM
**Location**: `src/app/api/payment/razorpay/create-order/route.ts` (Line 200-213)

**Problem**:
- Order data only stored in frontend (temporary)
- If verification fails, order data is lost
- No way to recover payment details later

**Impact**: Cannot manually recover failed payments

### 5. **Race Condition Between Webhook and Verification** ⚠️ MEDIUM
**Location**: Both webhook and verify routes

**Problem**:
- Both can try to create same payment simultaneously
- Idempotency check helps but doesn't prevent all issues
- Could cause duplicate tickets or missed payments

**Impact**: Inconsistent state

### 6. **Error Handling in Webhook** ⚠️ MEDIUM
**Location**: `src/app/api/payment/razorpay/webhook/route.ts` (Line 175-181)

**Problem**:
- Always returns 200 even on errors
- Prevents Razorpay from retrying failed webhooks
- Errors are logged but not actionable

**Impact**: Failed webhooks never retry

## Recommended Fixes

### Fix 1: Store Order Data in Database
- Create `RazorpayOrder` table to store order details
- Store eventId, userId, quantity, etc. when order is created
- Webhook can then retrieve order data even if notes are missing

### Fix 2: Improve Webhook Error Handling
- Return appropriate status codes for retryable errors
- Log errors to a monitoring system
- Add alerting for failed webhooks

### Fix 3: Add Payment Recovery Script
- Periodically sync payments from Razorpay API
- Match payments with orders
- Create missing tickets/payments

### Fix 4: Better Error Messages
- Store failed payment attempts
- Allow manual recovery
- Notify admin of failed payments

### Fix 5: Add Retry Logic
- Retry failed verification attempts
- Queue failed payments for retry
- Add exponential backoff


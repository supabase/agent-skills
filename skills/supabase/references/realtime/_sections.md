# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Channel Setup (setup)

**Impact:** HIGH
**Description:** Channel creation, naming conventions, configuration options, and authentication setup for private channels.

## 2. Broadcast Messaging (broadcast)

**Impact:** CRITICAL
**Description:** Sending and receiving real-time messages between clients, database-triggered broadcasts using `realtime.broadcast_changes()` and `realtime.send()`.

## 3. Presence Tracking (presence)

**Impact:** MEDIUM
**Description:** Tracking user online status, shared state synchronization, and presence lifecycle management.

## 4. Postgres Changes (postgres)

**Impact:** MEDIUM
**Description:** Database change listeners via logical replication. Note: Broadcast is recommended for new applications due to better scalability.

## 5. Implementation Patterns (patterns)

**Impact:** CRITICAL
**Description:** Channel cleanup, React integration patterns, error handling, and connection management best practices.

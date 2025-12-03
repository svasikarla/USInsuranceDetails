"""
Utility script to re-analyze existing policies that were processed before red flag analysis was added.

This script will trigger red flag analysis for all existing policies that have documents.
"""
import requests
import json

# Configuration
API_BASE_URL = "http://localhost:8000"  # Adjust if your backend runs on different port/host
AUTH_TOKEN = None  # Will be set after login

def login(email: str, password: str):
    """Login and get auth token"""
    global AUTH_TOKEN
    response = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )

    if response.status_code == 200:
        data = response.json()
        AUTH_TOKEN = data.get("access_token")
        print(f"[SUCCESS] Logged in successfully!")
        return True
    else:
        print(f"[ERROR] Login failed: {response.text}")
        return False

def get_all_policies():
    """Get all policies for the current user"""
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    response = requests.get(f"{API_BASE_URL}/api/policies", headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"[ERROR] Failed to get policies: {response.text}")
        return []

def reanalyze_policy(policy_id: str):
    """Trigger re-analysis for a specific policy"""
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    response = requests.post(
        f"{API_BASE_URL}/api/ai-analysis/reanalyze-policy/{policy_id}",
        headers=headers
    )

    if response.status_code == 200:
        result = response.json()
        print(f"  [SUCCESS] Policy {policy_id}: {result['red_flags_detected']} red flags, {result['benefits_extracted']} benefits")
        return True
    else:
        print(f"  [ERROR] Policy {policy_id}: {response.text}")
        return False

def main():
    """Main execution"""
    print("=" * 70)
    print(" Re-analyze Existing Policies for Red Flags")
    print("=" * 70)
    print()

    # Get credentials
    email = input("Enter your email: ").strip()
    password = input("Enter your password: ").strip()
    print()

    # Login
    if not login(email, password):
        return

    print()
    print("Fetching all policies...")
    policies = get_all_policies()

    if not policies:
        print("[INFO] No policies found.")
        return

    print(f"[INFO] Found {len(policies)} policies")
    print()

    # Ask for confirmation
    confirm = input(f"Re-analyze all {len(policies)} policies? (yes/no): ").strip().lower()
    if confirm not in ['yes', 'y']:
        print("Operation cancelled.")
        return

    print()
    print("Starting re-analysis...")
    print("-" * 70)

    success_count = 0
    fail_count = 0

    for i, policy in enumerate(policies, 1):
        policy_id = policy.get('id')
        policy_name = policy.get('policy_name', 'Unnamed')

        print(f"\n[{i}/{len(policies)}] Re-analyzing: {policy_name}")

        if reanalyze_policy(policy_id):
            success_count += 1
        else:
            fail_count += 1

    print()
    print("=" * 70)
    print("Re-analysis Complete!")
    print(f"  Success: {success_count}")
    print(f"  Failed: {fail_count}")
    print("=" * 70)
    print()
    print("Now refresh your browser to see the red flags!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")

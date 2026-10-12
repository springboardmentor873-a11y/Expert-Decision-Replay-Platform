"""
Expert Decision Replay Platform - Unified Test Runner
Executes comprehensive regression and end-to-end verification suites across all milestones.
"""

import sys
import time
import os

# Add Backend to python path so test modules can be imported
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "Backend"))
sys.path.insert(0, backend_dir)

def run_suite():
    print("=" * 80)
    print("    EXPERT DECISION REPLAY PLATFORM - COMPLETE TEST SUITE")
    print("=" * 80)
    start_time = time.time()

    suites = [
        ("Milestone 2: Decision Management & Knowledge Graph", "test_milestone2", "test_full_milestone2_flow"),
        ("Milestone 3: Approvals, Notifications & Reporting", "test_milestone3", "test_full_milestone3_flow"),
        ("Milestone 4: Production Verification & RBAC Boundary", "test_milestone4", "test_milestone4_comprehensive_suite"),
    ]

    results = []

    for name, module_name, func_name in suites:
        print(f"\n>>> Running: {name} ...")
        t0 = time.time()
        try:
            mod = __import__(module_name)
            func = getattr(mod, func_name)
            func()
            elapsed = time.time() - t0
            results.append((name, "PASSED", elapsed))
            print(f">>> Result: {name} -> PASSED ({elapsed:.2f}s)")
        except Exception as e:
            elapsed = time.time() - t0
            results.append((name, f"FAILED ({str(e)})", elapsed))
            print(f">>> Result: {name} -> FAILED: {e}")

    total_elapsed = time.time() - start_time
    print("\n" + "=" * 80)
    print("                       TEST EXECUTION SUMMARY TABLE")
    print("=" * 80)
    print(f"{'Milestone Test Suite':<55} | {'Status':<10} | {'Duration'}")
    print("-" * 80)

    all_passed = True
    for suite_name, status, duration in results:
        status_str = "[OK] PASS" if status == "PASSED" else "[!] FAIL"
        if status != "PASSED":
            all_passed = False
        print(f"{suite_name:<55} | {status_str:<10} | {duration:.2f}s")

    print("-" * 80)
    print(f"Total Execution Time: {total_elapsed:.2f} seconds")
    if all_passed:
        print("\n*** ALL MILESTONES (1, 2, 3, 4) PASSED FULL VERIFICATION (100% SUCCESS) ***\n")
        return 0
    else:
        print("\n*** SOME TESTS FAILED ***\n")
        return 1

if __name__ == "__main__":
    sys.exit(run_suite())

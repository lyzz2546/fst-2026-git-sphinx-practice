# Matrix Multiplication Project Report

**Student Name**: Yang Zhanxiang 
**Student ID**: ZY2557211
**Submission Date**: 2026.3.21


## System Configuration
List your system configuration as **table of content here** here, including CPU model, memory size, operating system version, compiler version, python version.

For Linux, check

-  **CPU Model**: Intel(R) Core(TM) i9-14900HX
-  **Memory Size**: 15 GB
-  **Operating System Version**: Linux (WSL2), Kernel 6.6.87.2
-  **Compiler Version**: GCC 13.3.0
-  **Python Version**: Python 3.12.3

## Implementation Details


### Python Language Implementation
-  **Source Code**: Include the Python script with comments explaining key sections.
```python
# matrix.py
# Matrix multiplication 

# Input dimensions (same as C: one line, two numbers)
rowA, colA = map(int, input("Enter rows and columns of matrix A: ").split())
rowB, colB = map(int, input("Enter rows and columns of matrix B: ").split())

# Check validity
if colA != rowB:
    print("Matrix multiplication is not possible.")
    print("The number of columns of A must equal the number of rows of B.")
    exit()

# Input matrix A
print(f"Enter elements of matrix A ({rowA} x {colA}):")
A = []
for i in range(rowA):
    print(f'Enter elements of row {i + 1}:')
    row = list(map(int, input().split()))
    A.append(row)

# Input matrix B
print(f"Enter elements of matrix B ({rowB} x {colB}):")
B = []
for i in range(rowB):
    print(f'Enter elements of row {i + 1}:')
    row = list(map(int, input().split()))
    B.append(row)

# Initialize result matrix
C = [[0 for _ in range(colB)] for _ in range(rowA)]

# Matrix multiplication
for i in range(rowA):
    for j in range(colB):
        for k in range(colA):
            C[i][j] += A[i][k] * B[k][j]

# Print result
print("\nResult matrix C = A x B:")
for row in C:
    print(row)
```

-  **Execution Command**: Describe how to run the Python script.
The Python script is executed using the following command:

```bash
python3 matrix.py
```

## Algorithm Verification
-  **Correctness**: Explain the methodology used to verify the correctness of the matrix multiplication algorithm.
The correctness of the matrix multiplication algorithm was verified by using a small test case and comparing the output with manual calculation.

For example, matrix A was set as:
1 2 3
4 5 6

Matrix B was set as:
7 8
9 10
11 12

By manual calculation, the result should be:
58 64
139 154

The outputs of both the C program and the Python program were consistent with the expected result. This shows that the algorithm works correctly.

In addition, the program checks whether the number of columns of matrix A equals the number of rows of matrix B before multiplication. If the dimensions are incompatible, the program reports an error message. This further helps ensure correctness.


## Conclusion
> Summarize the findings of the project, including key learnings about command line operations, Markdown documentation, and programming language differences.

In this project, matrix multiplication was implemented using both C and Python, and the performance of the two implementations was compared.

Through this project, I gained practical experience with command line operations, including compiling and running programs using GCC and executing Python scripts. I also learned how to use Markdown to create structured and readable technical documentation.

In terms of programming, both implementations used the same matrix multiplication algorithm based on three nested loops. However, the performance analysis showed that the C implementation is significantly faster than the Python implementation. This is mainly due to the differences in execution models, memory management, and data handling between compiled and interpreted languages.

Overall, this project helped me better understand the relationship between algorithm design and programming language characteristics, as well as the trade-offs between performance and ease of development.

## References
> List any resources or references used during the project, including documentation, tutorials, and external libraries.

The following resources were consulted during the project:

- GCC Official Documentation: https://gcc.gnu.org/
- Python Official Documentation: https://docs.python.org/3/
- Markdown Guide: https://www.markdownguide.org/
- Stack Overflow: https://stackoverflow.com/

## Appendix
-  **Additional Notes**: Include any additional notes or observations made during the project.

During the implementation, it was observed that the execution time of Python increased rapidly as the matrix size grew, while the C implementation remained relatively efficient. This highlights the performance advantage of compiled languages in computation-intensive tasks.
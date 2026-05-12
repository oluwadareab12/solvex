pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

// Checks a single cell value is in range [1, 9]
template ValidCell() {
    signal input in;

    component lt = LessThan(4);
    lt.in[0] <== in;
    lt.in[1] <== 10;
    lt.out === 1;

    component nz = IsZero();
    nz.in <== in;
    nz.out === 0;
}

// Checks that a 9-element array contains each of {1..9} exactly once
template AllDifferent() {
    signal input vals[9];

    component isEq[9][9];
    signal countStep[9][10];

    for (var v = 0; v < 9; v++) {
        countStep[v][0] <== 0;
        for (var i = 0; i < 9; i++) {
            isEq[v][i] = IsEqual();
            isEq[v][i].in[0] <== vals[i];
            isEq[v][i].in[1] <== v + 1;
            countStep[v][i+1] <== countStep[v][i] + isEq[v][i].out;
        }
        countStep[v][9] === 1;
    }
}

// Main Sudoku circuit
// Public:  puzzle[81]   — the clue grid (0 = blank, 1-9 = given digit)
// Private: solution[81] — the full solution the prover claims to know
template Sudoku() {
    signal input puzzle[81];
    signal input solution[81];

    // 1. Every solution cell is in [1, 9]
    component valid[81];
    for (var i = 0; i < 81; i++) {
        valid[i] = ValidCell();
        valid[i].in <== solution[i];
    }

    // 2. Where the puzzle has a clue, solution must match it
    //    puzzle[i] * (solution[i] - puzzle[i]) === 0
    //    — if puzzle[i] == 0 (blank) the constraint is trivially 0 == 0
    //    — if puzzle[i] == k the constraint forces solution[i] == k
    for (var i = 0; i < 81; i++) {
        puzzle[i] * (solution[i] - puzzle[i]) === 0;
    }

    // 3. Row uniqueness
    component rows[9];
    for (var r = 0; r < 9; r++) {
        rows[r] = AllDifferent();
        for (var c = 0; c < 9; c++) {
            rows[r].vals[c] <== solution[r * 9 + c];
        }
    }

    // 4. Column uniqueness
    component cols[9];
    for (var c = 0; c < 9; c++) {
        cols[c] = AllDifferent();
        for (var r = 0; r < 9; r++) {
            cols[c].vals[r] <== solution[r * 9 + c];
        }
    }

    // 5. 3x3 box uniqueness
    component boxes[9];
    for (var b = 0; b < 9; b++) {
        boxes[b] = AllDifferent();
        var br = (b \ 3) * 3;
        var bc = (b % 3) * 3;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                boxes[b].vals[i * 3 + j] <== solution[(br + i) * 9 + (bc + j)];
            }
        }
    }
}

component main { public [puzzle] } = Sudoku();

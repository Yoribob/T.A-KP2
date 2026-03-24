import random
from config_loader import CONFIG
import tkinter as tk
from tkinter import filedialog
import os

MAX = CONFIG["main"]["max_size"]

def array_create(n=None, m=None, mode="Manual", file_path=None):
    if mode == "Manual":
        if n is None or m is None:
            raise ValueError(f"No arguments provided")
    elif mode == "Auto":
        n = random.randint(3, min(8, MAX))
        m = random.randint(3, min(8, MAX))
    elif mode == "File":
        if not file_path or not os.path.isfile(file_path):
            raise ValueError("File not found or invalid path")
        try:
            with open(file_path, "r") as f:
                content = f.read().strip()
                parts = content.replace(",", " ").split()
                if len(parts) != 2:
                    raise ValueError("File must contain exactly two numbers (n and m)")
                n, m = map(int, parts)
        except Exception as e:
            raise ValueError(f"Error reading file: {e}")
    else:
        raise ValueError("Invalid mode")

    if not isinstance(n, int) or not isinstance(m, int):
        raise ValueError("Arguments n and m must be integers")

    if n <= 0 or m <= 0 or n > MAX or m > MAX:
        raise ValueError(f"Arguments must be between 1 and {MAX}")

    array = []
    for i in range(n):
        row = []
        for j in range(m):
            row.append(random.randrange(0, 5))
        array.append(row)
    
    return n, m, array

def find_zeros(array):
    if not array:
        raise ValueError("Array is empty or not defined")
    
    count = 0
    for i in range(len(array)):
        for j in range(len(array[i])):
            if array[i][j] == 0:
                count += 1
    return count

def select_file():
    root = tk.Tk()
    root.withdraw() 
    file_path = filedialog.askopenfilename(
        title="Select a file",
        filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
    )
    root.destroy()
    return file_path

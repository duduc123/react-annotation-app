# This is a sample Python script.

# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.
import numpy as np

def print_hi(name):
    # Use a breakpoint in the code line below to debug your script.
    print(f'Hi, {name}')  # Press Ctrl+F8 to toggle the breakpoint.

def generate_bin():
    # 车辆点云（集中在一块区域）
    car_points = np.random.normal(loc=[5, 0, 0], scale=0.5, size=(100, 3))
    # 树木点云（竖直分布）
    tree_points = np.random.normal(loc=[0, 5, 0], scale=[0.3, 1.0, 0.3], size=(80, 3))
    # 行人点云（小范围分布）
    person_points = np.random.normal(loc=[-5, 0, 0], scale=0.2, size=(50, 3))

    all_points = np.vstack([car_points, tree_points, person_points]).astype(np.float32)
    all_points.tofile("lidar_000111.bin")

# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    print_hi('PyCharm')

# See PyCharm help at https://www.jetbrains.com/help/pycharm/

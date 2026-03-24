import pygame
from config_loader import CONFIG
from main import array_create, find_zeros, select_file

pygame.init()

WIDTH, HEIGHT = CONFIG["window"]["width"], CONFIG["window"]["height"]
colors = CONFIG.get("colors", {})
showArray = CONFIG["window"]["showArray"]
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("КП №1")

clock = pygame.time.Clock()
font = pygame.font.SysFont(None, CONFIG["font"]["size"])

active_field = None
cursor_visible = True
cursor_timer = 0
cursor_interval = CONFIG["main"]["cursor_interval"]

labels = ["Input", "Array", "Output"]
n_text = ""
m_text = ""
input_items = []
array_items = []
output_items = []

n_rect = pygame.Rect(50, HEIGHT-90, 60, 40)
m_rect = pygame.Rect(150, HEIGHT-90, 60, 40)

button_width, button_height = 120, 40
manual_button = pygame.Rect(WIDTH-200, HEIGHT-170, button_width, button_height)
auto_button = pygame.Rect(WIDTH-200, HEIGHT-130, button_width, button_height)
file_button = pygame.Rect(WIDTH-200, HEIGHT-90, button_width, button_height)
calculate_button = pygame.Rect(WIDTH-420, HEIGHT-90, 160, 40)
button_labels = ["Manual", "Auto", "File select"]

input_mode = "Manual"

error_message = ""
error_timer = 0
error_duration = CONFIG["main"]["error_timer"]

def render_scene():
    screen.fill(colors.get("background"))
    column_width = WIDTH / 3
    line_height = CONFIG["font"]["line_height"]

    if error_message and error_timer > 0:
        pygame.draw.rect(screen, colors.get("error_bg"), (0, 0, WIDTH, 50))
        err_surf = font.render(error_message, True, colors.get("error_text"))
        err_rect = err_surf.get_rect(center=(WIDTH / 2, 25))
        screen.blit(err_surf, err_rect)

    for i, label_text in enumerate(labels):
        label_surface = font.render(label_text, True, colors.get("label"))
        label_rect = label_surface.get_rect()
        x = (i + 0.5) * column_width - label_rect.width / 2
        screen.blit(label_surface, (x, 50))

    if input_mode == "Manual":
        for rect, text_val, placeholder, field_name in [(n_rect, n_text, "n:", "n"), (m_rect, m_text, "m:", "m")]:
            pygame.draw.rect(screen, colors.get("input_bg"), rect, border_radius=6)
            if active_field == field_name:
                border_color = colors.get("input_active_border")
            else:
                border_color = colors.get("input_border")
            pygame.draw.rect(screen, border_color, rect, 2, border_radius=6)
            if text_val:
                txt_surf = font.render(text_val, True, colors.get("input_text"))
            else:
                txt_surf = font.render(placeholder, True, colors.get("input_placeholder"))
            screen.blit(txt_surf, (rect.x + 10, rect.y + 8))
            if active_field == field_name and cursor_visible and text_val:
                cursor_x = rect.x + 10 + txt_surf.get_width() + 2
                cursor_y = rect.y + 8
                cursor_h = txt_surf.get_height()
                pygame.draw.line(screen, colors.get("cursor"), (cursor_x, cursor_y), (cursor_x, cursor_y + cursor_h), 2)

    for i, item in enumerate(input_items):
        item_surface = font.render(str(item), True, colors.get("item_text"))
        start_x = column_width * 0.5 - item_surface.get_width() / 2
        screen.blit(item_surface, (start_x, 80 + i * line_height))


    if showArray:
        for i, item in enumerate(array_items):
            item_surface = font.render(str(item), True, colors.get("item_text"))
            start_x = column_width * 1.5 - item_surface.get_width() / 2
            screen.blit(item_surface, (start_x, 80 + i * line_height))

    for i, item in enumerate(output_items):
        item_surface = font.render(str(item), True, colors.get("item_text"))
        start_x = column_width * 2.5 - item_surface.get_width() / 2
        screen.blit(item_surface, (start_x, 80 + i * line_height))

    for rect, label in zip([manual_button, auto_button, file_button], button_labels):
        pygame.draw.rect(screen, colors.get("button_bg"), rect, border_radius=6)
        if input_mode == label:
            color = colors.get("button_active_border")
        else:
            color = colors.get("button_border")
        pygame.draw.rect(screen, color, rect, 2, border_radius=6)
        text_surf = font.render(label, True, colors.get("button_text"))
        text_rect = text_surf.get_rect(center=rect.center)
        screen.blit(text_surf, text_rect)

    pygame.draw.rect(screen, colors.get("button_bg"), calculate_button, border_radius=6)
    pygame.draw.rect(screen, colors.get("button_border"), calculate_button, 2, border_radius=6)
    text_surf = font.render("Calculate", True, colors.get("button_text"))
    text_rect = text_surf.get_rect(center=calculate_button.center)
    screen.blit(text_surf, text_rect)


running = True
while running:
    dt = clock.get_time()
    mouse_pos = pygame.mouse.get_pos()
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        if event.type == pygame.MOUSEBUTTONDOWN:
            if n_rect.collidepoint(event.pos):
                active_field = "n"
            elif m_rect.collidepoint(event.pos):
                active_field = "m"
            else:
                active_field = None

            if manual_button.collidepoint(event.pos):
                input_mode = "Manual"
            elif auto_button.collidepoint(event.pos):
                input_mode = "Auto"

            if file_button.collidepoint(event.pos):
                input_mode = "File"
                file_path = select_file()
                try:
                    with open(file_path, "r") as f:
                        content = f.read().strip()
                        parts = content.split(",")
                        if len(parts) != 2:
                            raise ValueError("File must contain exactly 2 numbers separated by a comma")

                        n_val = int(parts[0].strip())
                        m_val = int(parts[1].strip())
                        MAX = CONFIG["main"]["max_size"]

                        if n_val <= 0 or m_val <= 0 or n_val > MAX or m_val > MAX:
                            raise ValueError(f"n and m must be between 1 and {MAX}")

                        input_items = [f"n: {n_val}", f"m: {m_val}"]
                        error_message = ""
                        error_timer = 0

                except Exception as err:
                    error_message = str(err)
                    error_timer = CONFIG["main"]["error_timer"]
                    input_items = []

            if calculate_button.collidepoint(event.pos):
                error_message = ""
                try:
                    if input_mode == "Manual":
                        n_val = int(n_text) if n_text else None
                        m_val = int(m_text) if m_text else None
                        n_val, m_val, array = array_create(n_val, m_val, "Manual")
                        input_items = [f"n: {n_val}", f"m: {m_val}"]

                    elif input_mode == "Auto":
                        n_val, m_val, array = array_create(mode="Auto")
                        input_items = [f"n: {n_val}", f"m: {m_val}"]

                    elif input_mode == "File":
                        n_val, m_val, array = array_create(mode="File", file_path=file_path)

                    with open("result_array.txt", "w", encoding="utf-8") as f:
                        for row in array:
                            f.write(" ".join(map(str, row)) + "\n")
                    if(showArray):
                        array_items = []
                        for row in array:
                            new_row = row[:]
                            array_items.append(new_row)

                    output_items = [f"Number of zeros: {find_zeros(array)}"]

                except ValueError as err:
                    error_message = str(err)
                    error_timer = CONFIG["main"]["error_timer"]

        if event.type == pygame.KEYDOWN:
            MAX_LENGTH = CONFIG["main"]["max_input_length"]

            if event.type == pygame.KEYDOWN:
                if active_field == "n":
                    if event.key == pygame.K_BACKSPACE:
                        n_text = n_text[:-1]
                    elif event.key == pygame.K_RETURN:
                        active_field = None
                    elif event.unicode.isdigit() and len(n_text) < MAX_LENGTH:
                        n_text += event.unicode

            if active_field == "m":
                if event.key == pygame.K_BACKSPACE:
                    m_text = m_text[:-1]
                elif event.key == pygame.K_RETURN:
                    active_field = None
                elif event.unicode.isdigit() and len(m_text) < MAX_LENGTH:
                    m_text += event.unicode

    if active_field:
        cursor_timer += dt
        if cursor_timer >= cursor_interval:
            cursor_timer = 0
            cursor_visible = not cursor_visible
    else:
        cursor_visible = False
        cursor_timer = 0

    if error_timer > 0:
        error_timer -= dt
        if error_timer < 0:
            error_timer = 0

    render_scene()
    pygame.display.flip()
    clock.tick(60)

pygame.quit()

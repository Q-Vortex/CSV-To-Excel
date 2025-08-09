import webbrowser

if __name__ == "__main__":
    url = "http://localhost:3000"
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Open url error: {e}")

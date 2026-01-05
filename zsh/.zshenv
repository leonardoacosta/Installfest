[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"

# Secrets
[ -f "$HOME/.env" ] && source "$HOME/.env"

# Themes
export TMUX_THEME="one-hunter-vercel"
export NVIM_THEME="nord"
export STARSHIP_THEME="nord"
export WEZTERM_THEME="nord"

# Locale settings
export LANG="en_US.UTF-8" # Sets default locale for all categories
export LC_ALL="en_US.UTF-8" # Overrides all other locale settings
export LC_CTYPE="en_US.UTF-8" # Controls character classification and case conversion

# Use cursor as default editor
export EDITOR="cursor"
export VISUAL="cursor"

# Add /usr/local/bin to the beginning of the PATH environment variable.
# This ensures that executables in /usr/local/bin are found before other directories in the PATH.
export PATH="/usr/local/bin:$PATH"

# Set LDFLAGS environment variable for the linker to use the specified directories for library files.
# This is useful when building software that depends on non-standard library locations, like zlib and bzip2 in this case.
export LDFLAGS="-L/usr/local/opt/zlib/lib -L/usr/local/opt/bzip2/lib"

# Set CPPFLAGS environment variable for the C/C++ preprocessor to use the specified directories for header files.
# This is useful when building software that depends on non-standard header locations, like zlib and bzip2 in this case.
export CPPFLAGS="-I/usr/local/opt/zlib/include -I/usr/local/opt/bzip2/include"

# Hide computer name in terminal
export DEFAULT_USER="$(whoami)"
# uv
export PATH="/Users/leonardoacosta/.local/bin:$PATH"
eval "$(/opt/homebrew/bin/brew shellenv)"

# elevenlabs api key
export ELEVENLABS_API_KEY="sk_4fdc3f7d1b54864b537d64a6c57e8c28f172aa5e38f35769"

# Install xcode command line tools, required for homebrew
sudo xcode-select --install

# Install homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add homebrew to path
(echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/leonardoacosta/.zprofile

# Install personal homebrew packages
brew install \
  azure-cli \
  dotnet \
  node \
  nvm \
  pnpm \
  starship \
  watchman \
  zsh-syntax-highlighting \
  zsh-autosuggestions

brew install --cask \
  adobe-creative-cloud \
  beekeeper-studio \
  bruno \
  cursor \
  discord \
  fantastical \
  gitkraken \
  google-chrome \
  notion \
  obsidian \
  raycast \
  spotify \
  steam \
  superhuman \
  telegram \
  visual-studio-code \
  windows-app

# .zshrc config
touch ~/.zshrc # Create the file if it doesn't exist
cat .zshrc >> ~/.zshrc


# wezterm config
touch ~/.config/wezterm/wezterm.lua
cat wezterm.lua >> ~/.config/wezterm/wezterm.lua

# starship config
touch ~/.config/starship.toml
cat starship.toml >> ~/.config/starship.toml
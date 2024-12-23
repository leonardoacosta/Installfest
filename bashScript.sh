# Install xcode command line tools, required for homebrew
sudo xcode-select --install

# Install homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add homebrew to path
(echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/leonardoacosta/.zprofile

# Install homebrew taps
# brew tap oven-sh/bun

# Install personal homebrew packages
brew install \
  azure-cli \
  dotnet \
  iterm2 \
  node \
  nvm \
  pnpm \
  watchman \
  zsh

brew install --cask \
  adobe-creative-cloud \
  beekeeper-studio \
  bruno \
  discord \
  fantastical \
  gitkraken \
  google-chrome \
  notion \
  raycast \
  spotify \
  steam \
  superhuman \
  telegram \
  visual-studio-code \
  windows-app

# Set zsh as the default shell
# source ~/.zshrc
# chsh -s /opt/homebrew/bin/zsh

# Install oh-my-zsh
# ? [Refrence](https://github.com/ohmyzsh/ohmyzsh)
# ? Don't worry about grabbing the fonts, they install automatically
sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

# Install powerlevel10k
git clone https://github.com/romkatv/powerlevel10k.git $ZSH_CUSTOM/themes/powerlevel10k

# Install zsh plugins
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
sudo gem install colorls

# Configure zsh, powerlevel10k and zsh plugins
sed -i '' 's/ZSH_THEME="robbyrussell"/ZSH_THEME="powerlevel10k\/powerlevel10k"/g' ~/.zshrc
sed -i '' 's/plugins=(git)/plugins=(git zsh-syntax-highlighting zsh-autosuggestions)/g' ~/.zshrc

# Configure colorls, by editing the .zshrc file:
# ``` bash
# if [ -x "$(command -v colorls)" ]; then
#     alias ls="colorls"
#     alias la="colorls -al"
# fi
# ```

# Configure powerlevel10k
p10k configure

# go grab the latest version of Toggl
# https://toggl.com/track/time-tracking-mac/

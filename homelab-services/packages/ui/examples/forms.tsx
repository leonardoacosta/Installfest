/**
 * Forms Example
 *
 * Comprehensive form examples demonstrating validation states, icon support,
 * and best practices for accessible forms.
 */

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Alert,
  AlertDescription,
  Separator,
} from "../src"

import {
  Mail,
  Lock,
  User,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Calendar,
  DollarSign,
} from "lucide-react"

export function FormsExample() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [emailError, setEmailError] = React.useState("")
  const [formSubmitted, setFormSubmitted] = React.useState(false)

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Invalid email format")
      return false
    }
    setEmailError("")
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateEmail(email)) {
      setFormSubmitted(true)
      setTimeout(() => setFormSubmitted(false), 3000)
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forms Gallery</h1>
        <p className="text-muted-foreground">
          Form components with validation states, icons, and accessibility features
        </p>
      </div>

      {formSubmitted && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Form submitted successfully! (Demo only)
          </AlertDescription>
        </Alert>
      )}

      {/* Input Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Input Variants & Validation States</CardTitle>
          <CardDescription>
            Inputs with different states and visual feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Input */}
          <div className="space-y-2">
            <Label htmlFor="default-input">Default Input</Label>
            <Input
              id="default-input"
              type="text"
              placeholder="Enter text..."
            />
            <p className="text-sm text-muted-foreground">
              Standard input with default styling
            </p>
          </div>

          <Separator />

          {/* Success State */}
          <div className="space-y-2">
            <Label htmlFor="success-input">Success State</Label>
            <Input
              id="success-input"
              type="text"
              variant="success"
              defaultValue="valid@email.com"
              suffix={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            />
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Valid email address
            </p>
          </div>

          <Separator />

          {/* Error State */}
          <div className="space-y-2">
            <Label htmlFor="error-input">Error State</Label>
            <Input
              id="error-input"
              type="text"
              variant="error"
              defaultValue="invalid-email"
              suffix={<AlertCircle className="h-4 w-4 text-red-500" />}
            />
            <p className="text-sm text-red-600 dark:text-red-400">
              ✗ Invalid email format
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Input with Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Inputs with Icons</CardTitle>
          <CardDescription>
            Prefix and suffix icon support for enhanced UX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-icon">Email with Icon</Label>
            <Input
              id="email-icon"
              type="email"
              placeholder="you@example.com"
              prefix={<Mail className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-icon">Search</Label>
            <Input
              id="search-icon"
              type="text"
              placeholder="Search..."
              prefix={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-toggle">Password with Toggle</Label>
            <Input
              id="password-toggle"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              prefix={<Lock className="h-4 w-4" />}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              prefix={<DollarSign className="h-4 w-4" />}
              suffix={<span className="text-sm">USD</span>}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-number">Card Number</Label>
            <Input
              id="card-number"
              type="text"
              placeholder="1234 5678 9012 3456"
              prefix={<CreditCard className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              prefix={<Calendar className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Complete Login Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Login Form Example</CardTitle>
            <CardDescription>
              Complete form with validation and submit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                prefix={<Mail className="h-4 w-4" />}
                variant={emailError ? "error" : email && !emailError ? "success" : "default"}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (e.target.value) validateEmail(e.target.value)
                }}
                onBlur={() => validateEmail(email)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                prefix={<Lock className="h-4 w-4" />}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pointer-events-auto cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="font-normal cursor-pointer">
                Remember me
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" type="button">
              Forgot password?
            </Button>
            <Button type="submit" variant="cyan">
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* All Form Controls */}
      <Card>
        <CardHeader>
          <CardTitle>All Form Controls</CardTitle>
          <CardDescription>
            Complete set of form inputs and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Inputs */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              prefix={<User className="h-4 w-4" />}
            />
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Brief description for your profile. Max 200 characters.
            </p>
          </div>

          {/* Select */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="au">Australia</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Radio Group */}
          <div className="space-y-3">
            <Label>Notification Preference</Label>
            <RadioGroup defaultValue="email">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="radio-email" />
                <Label htmlFor="radio-email" className="font-normal cursor-pointer">
                  Email notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="radio-sms" />
                <Label htmlFor="radio-sms" className="font-normal cursor-pointer">
                  SMS notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="radio-none" />
                <Label htmlFor="radio-none" className="font-normal cursor-pointer">
                  No notifications
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Checkboxes */}
          <div className="space-y-3">
            <Label>Preferences</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="newsletter" />
                <Label htmlFor="newsletter" className="font-normal cursor-pointer">
                  Subscribe to newsletter
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="marketing" />
                <Label htmlFor="marketing" className="font-normal cursor-pointer">
                  Receive marketing emails
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="updates" defaultChecked />
                <Label htmlFor="updates" className="font-normal cursor-pointer">
                  Product updates and announcements
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark theme
                </p>
              </div>
              <Switch id="dark-mode" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Switch id="2fa" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications
                </p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button variant="success">Save Changes</Button>
        </CardFooter>
      </Card>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>
            All button styles including new semantic variants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default (Primary)</Button>
            <Button variant="cyan">Cyan CTA</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="cyan">Small</Button>
            <Button size="default" variant="cyan">Default</Button>
            <Button size="lg" variant="cyan">Large</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FormsExample

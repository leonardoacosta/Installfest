# Native Modules Patterns

## Camera

```typescript
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import { Button, View } from "react-native";

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const cameraRef = useRef<CameraView>(null);

  if (!permission?.granted) {
    return (
      <View className="flex-1 justify-center items-center">
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      // Upload via tRPC
      // await api.media.upload.mutate({ uri: photo.uri });
    }
  };

  return (
    <CameraView ref={cameraRef} className="flex-1" facing={facing}>
      <View className="flex-1 flex-row justify-around items-end pb-10">
        <Button title="Flip" onPress={() => setFacing(f => f === "back" ? "front" : "back")} />
        <Button title="Capture" onPress={takePicture} />
      </View>
    </CameraView>
  );
}
```

## Push Notifications

```typescript
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "@/lib/trpc";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();

  // Register token with backend via tRPC
  await api.user.registerPushToken.mutate({ token: token.data });

  return token.data;
}
```

## Secure Storage + Auth

```typescript
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Usage with tRPC
export function useLogout() {
  const utils = api.useUtils();

  return async () => {
    await deleteToken();
    utils.invalidate(); // Clear all cached queries
  };
}
```

## Biometric Auth

```typescript
import * as LocalAuthentication from "expo-local-authentication";

export async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return { success: false, error: "No biometric hardware" };

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return { success: false, error: "No biometrics enrolled" };

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to continue",
    cancelLabel: "Cancel",
  });

  return { success: result.success, error: result.error };
}
```

## Image Picker with Upload

```typescript
import * as ImagePicker from "expo-image-picker";
import { api } from "@/lib/trpc";

export function useImageUpload() {
  const uploadMutation = api.media.getUploadUrl.useMutation();

  const pickAndUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];

    // Get presigned URL from tRPC
    const { uploadUrl, publicUrl } = await uploadMutation.mutateAsync({
      contentType: "image/jpeg",
    });

    // Upload to presigned URL
    await fetch(uploadUrl, {
      method: "PUT",
      body: await fetch(asset.uri).then(r => r.blob()),
      headers: { "Content-Type": "image/jpeg" },
    });

    return publicUrl;
  };

  return { pickAndUpload, isUploading: uploadMutation.isPending };
}
```

## Location

```typescript
import * as Location from "expo-location";

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  return location;
}
```

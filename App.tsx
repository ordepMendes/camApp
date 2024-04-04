import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Camera,
  CameraPosition,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";

import { Video, ResizeMode } from "expo-av";
import * as MediaLibrary from "expo-media-library";

const { height: heightScreen, width: widthScreen } = Dimensions.get("screen");

export default function App() {
  const [typeCam, setTypeCam] = useState<CameraPosition>("back");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const device = useCameraDevice(typeCam);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const {
    hasPermission: hasMicPermission,
    requestPermission: requestMicPermission,
  } = useMicrophonePermission();
  const [permission, setPermission] = useState<null | boolean>(null);
  const cameraRef = useRef<Camera>(null);

  const startRecording = () => {
    if (!cameraRef.current || !device) return;
    setIsRecording(true);
    cameraRef.current?.startRecording({
      onRecordingFinished: (video) => {
        setIsRecording(false);
        setVideoUri(video.path);
        setModalVisible(true);
      },
      onRecordingError: (error) => {
        console.log(error);
      },
    });
  };

  const stopRecording = async () => {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const replaceCam = () => {
    setTypeCam((currentCam) => (currentCam === "back" ? "front" : "back"));
  };

  function handleCloseModal() {
    setModalVisible(false);
  }

  async function handleSaveVideo() {
    if (videoUri) {
      try {
        await MediaLibrary.createAssetAsync(videoUri);
        Alert.alert("Salvo com sucesso", "O video foi salvo!");
      } catch (error) {
        Alert.alert(
          "Erro ao salvar",
          `Ocorreu um erro ao tentar salvar o video: ${error}`
        );
      }
    }
  }

  useEffect(() => {
    async function checkPermissions() {
      const statusCamera = await requestPermission();
      const statusMic = await requestMicPermission();

      if (statusCamera && statusMic) {
        setPermission(true);
      } else {
        Alert.alert(
          "Erro",
          "Permissão para câmera ou microfone não concedida."
        );
        setPermission(false);
      }

      const { status: statusMediaLibrary } =
        await MediaLibrary.requestPermissionsAsync();
      if (statusMediaLibrary !== "granted") {
        Alert.alert("Acesso aos arquivos nao autorizado");
        setPermission(false);
        return;
      }
    }

    checkPermissions();
  }, []);

  if (permission === null) {
    return (
      <View>
        <Text>Verificando permissões...</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View>
        <Text>Acesso negado</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View>
        <Text>Nenhuma câmera detectada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Camera
        style={StyleSheet.absoluteFill}
        ref={cameraRef}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        orientation="portrait"
        resizeMode="cover"
      />
      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        style={{
          width: 70,
          height: 70,
          borderRadius: 99,
          backgroundColor: "red",
          position: "absolute",
          bottom: 70,
          alignSelf: "center",
        }}
      />
      <View>
        <TouchableOpacity
          onPress={replaceCam}
          style={{
            width: 50,
            height: 50,
            backgroundColor: "#000",
            opacity: 0.5,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 99,
            position: "absolute",
            top: 15,
            right: 10,
            alignSelf: "center",
          }}
        >
          <MaterialIcons name="sync" size={40} color="#fff" />
        </TouchableOpacity>
        {isRecording && (
          <View
            style={{
              top: 15,
              left: 10,
            }}
          >
            <MaterialIcons name="videocam" size={25} color="#fff" />
          </View>
        )}
        {videoUri && (
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={handleCloseModal}
          >
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: videoUri }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                shouldPlay
                isLooping
                resizeMode={ResizeMode.COVER}
                style={{ width: widthScreen, height: heightScreen }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleCloseModal}
              >
                <Text style={{ color: "#000" }}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSaveVideo}>
                <Text style={{ color: "#000" }}>Salvar Video</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    position: "absolute",
    zIndex: 99,
    flexDirection: "row",
    gap: 14,
  },
  button: {
    backgroundColor: "#fff",
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 8,
    paddingBottom: 8,
    top: 24,
    left: 24,
    borderRadius: 4,
  },
});

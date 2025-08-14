import React, { forwardRef, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';

type Props = {
  value: string;
  skinMap: Record<string, any>;     // require(...) or { uri }
  skinNames?: Record<string, string>;
  onConfirm: (v: string) => void;
};

export type TPSkinSheetRef = {
  present: () => void;
  dismiss: () => void;
};

const TPSkinSheet = forwardRef<TPSkinSheetRef, Props>(
  ({ value, skinMap, skinNames = {}, onConfirm }, ref) => {
    const snapPoints = useMemo(() => ['35%'], []);
    const [temp, setTemp] = useState(value);

    const modalRef = React.useRef<BottomSheetModal>(null);
    React.useImperativeHandle(ref, () => ({
      present: () => {
        console.log('🔍 [DEBUG] TPSkinSheet present() called');
        setTemp(value);
        modalRef.current?.present();
      },
      dismiss: () => {
        console.log('🔍 [DEBUG] TPSkinSheet dismiss() called');
        modalRef.current?.dismiss();
      },
    }), [value]);

         return (
       <BottomSheetModal
         ref={modalRef}
         snapPoints={snapPoints}
         enablePanDownToClose
         onPresent={() => console.log('🔍 [DEBUG] BottomSheetModal onPresent called')}
         onDismiss={() => console.log('🔍 [DEBUG] BottomSheetModal onDismiss called')}
         backdropComponent={(p) => (
           <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
         )}
         handleIndicatorStyle={{ backgroundColor: '#2C3E50' }}
         backgroundStyle={{ backgroundColor: '#fff' }}
       >
        <View style={S.container}>
          <Text style={S.title}>Choose Paper Color</Text>

          <View style={S.preview}>
            {!!skinMap[temp] && (
              <Image source={skinMap[temp]} style={S.previewImg} resizeMode="contain" />
            )}
            <Text style={S.previewName}>{skinNames[temp] ?? temp}</Text>
          </View>

          <View style={S.pickerWrap}>
            <Picker selectedValue={temp} onValueChange={setTemp} itemStyle={{ fontSize: 16 }}>
              {Object.keys(skinMap).map((k) => (
                <Picker.Item key={k} label={skinNames[k] ?? k} value={k} />
              ))}
            </Picker>
          </View>

          <View style={S.row}>
            <Text onPress={() => modalRef.current?.dismiss()} style={S.btnSecondary}>Cancel</Text>
            <Text
              onPress={() => { onConfirm(temp); modalRef.current?.dismiss(); }}
              style={S.btnPrimary}
            >
              Done
            </Text>
          </View>
        </View>
      </BottomSheetModal>
    );
  }
);

const S = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  title: { textAlign: 'center', fontWeight: '700', color: '#2C3E50', fontSize: 16 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'center' },
  previewImg: { width: 56, height: 56 },
  previewName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  pickerWrap: { borderRadius: 12, borderWidth: 1, borderColor: '#D0D7DE', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  btnSecondary: { padding: 12, fontWeight: '700', color: '#6B7280' },
  btnPrimary: { padding: 12, fontWeight: '700', color: '#0EA5E9' },
});

export default TPSkinSheet;
